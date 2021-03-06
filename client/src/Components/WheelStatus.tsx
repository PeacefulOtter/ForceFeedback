import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs'

import Axis from './Axis';
import ParamSlider from './ParamSlider';
import Recording from './Recording';
import { lengthSliderStyle } from './FFSliders'; 

import { Status, Poll } from '../assets/models';
import { getRequest, postRequest } from '../assets/request';

import '../css/status.css';
import '../App.css';

const brokerURL = "ws://localhost:8888/ws"

const formatDescription = (desc: string | undefined, ffdesc: string | undefined) => {
    if ( desc === undefined || ffdesc === undefined ) return <></>

    const fullDesc = desc + ',' + ffdesc;
    const attributes = fullDesc.split(',')
    const removeIndices = [0, 6]

    return attributes
        .filter((attrib, i) => !removeIndices.includes(i))
        .map( attrib => {
            return <div key={Math.random()} className="btn status-desc">{attrib}</div>
        })
}

const WheelStatus = () => {
    const [poll, setPoll] = useState<Poll>()
    const [status, setStatus] = useState<Status>()

    useEffect(() => {
        getRequest("/status", setStatus )

        const client = new Client(); 
        
        client.configure({
            brokerURL: brokerURL,
            onConnect: () => {
                console.log('onConnect');
      
                client.subscribe('/topic/poll', message => {
                    const arr = Array.from(message.binaryBody)
                    const res = String.fromCharCode.apply(null, arr)
                    const status = JSON.parse(res);
                    // console.log(status);
                    setPoll(status)
                });
            },
            debug: (str) => {
              // console.log(new Date(), str);
            }
        });

        client.activate();
    }, [])

    const moveWheel = (val: number) => {
        const PARAMS = { angle: val }
        console.log(PARAMS);
        
        postRequest('/control', PARAMS, (data) => {
            console.log(data);
        })
    }


    return (
        <div className="status-wrapper">
            
            <div className="ff-title">
                <div className="ff-main-title">ForceFeedback</div>
                <div className="ff-sub-title">Controller</div>
            </div>

            <div className="status-header">
                <div className="btn btn-purple-checked status-gain">{status?.gain}%</div>
                <div className={`btn ${status?.active ? "btn-success-checked" : "btn-error-checked"} status-active`}>{status?.active ? "connected" : "disconnected"}</div>
                <div className="wheel-name">{status?.name}</div>
            </div>

            <div className="wheel-description">{formatDescription(status?.description, status?.ffDescription)}</div>

            <Axis axis={poll?.axisAngle || 0} />
            <ParamSlider 
                name="Move"
                style={lengthSliderStyle} 
                min={-1} max={1} step={0.02} allowMark={true} 
                callback={moveWheel}/>

            <Recording />
        </div>
    )
}

export default WheelStatus;
