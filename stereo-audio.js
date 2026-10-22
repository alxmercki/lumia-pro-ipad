/* Stereo balance: never sum L and R. Mono is duplicated before splitting. */
(function(root){
  'use strict';
  function clamp(value){return typeof value==='number'&&Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0}
  function stereoGain(ctx){
    const gain=ctx.createGain();
    gain.channelCount=2;gain.channelCountMode='explicit';gain.channelInterpretation='speakers';
    return gain;
  }
  function createBalance(ctx,value=0){
    const input=stereoGain(ctx),split=ctx.createChannelSplitter(2),left=ctx.createGain(),right=ctx.createGain(),output=ctx.createChannelMerger(2);
    input.connect(split);split.connect(left,0);split.connect(right,1);
    left.connect(output,0,0);right.connect(output,0,1);
    function set(value,immediate=false){
      const b=clamp(value),now=ctx.currentTime;
      for(const [param,target] of [[left.gain,b>0?1-b:1],[right.gain,b<0?1+b:1]]){
        param.cancelScheduledValues(now);
        if(immediate)param.setValueAtTime(target,now);else param.setTargetAtTime(target,now,0.015);
      }
    }
    set(value,true);
    return {input,output,set,disconnect(){for(const n of [input,split,left,right,output])n.disconnect()}};
  }
  function configureDestination(ctx){
    // iPad/Safari may expose a mono route. Do not request unsupported channels.
    const out=ctx.destination;
    try{if(out.maxChannelCount>=2){out.channelCount=2;out.channelCountMode='explicit';out.channelInterpretation='speakers'}}catch(e){}
    return out.channelCount;
  }
  const api={clamp,stereoGain,createBalance,configureDestination};
  root.LumiaStereo=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
