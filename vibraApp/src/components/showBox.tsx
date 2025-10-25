/* 
  showBox.tsx
 */

/* Dependencies  */
import {useEffect, useState } from "react";

/* types */
import type {DynamicProps} from "../types/dynamicProps";
import type {BoxProps} from "../types/boxProps";

/* Components */

/* styles */

const ShowBox = (props:BoxProps) => {
  const [dply, setDisplay]:[string,any] = useState("none");
  
  useEffect(()=>{
    if(props.dataShow.length===0) 
          setDisplay("none");
    else 
          setDisplay("block");
  },[props.dataShow]);

  
  /* sendDataToParent */
  const handleSelect = (event:any) => {
   event.preventDefault();
   //console.log(event.target.options[event.target.selectedIndex].value);
   props.dataSelect(event);
  };

  const checkProp=(obj:any,key:string):boolean=>{
    return obj.hasOwnProperty(key) && obj[key].length;
  };

  const render=(datum:DynamicProps)=>{
    const type:string[]=["artist","song","album"];
    switch (type[datum.type]) {
      case "artist":
        return (<>
                  <option value={datum.type+"-"+datum.id} >{datum.artist}</option>
                </>);
      case "song":
        return (<>
                  <option value={datum.type+"-"+datum.id} >{datum.title+" - "+datum.album+" - "+datum.artist}</option>
                </>);
      case "album":
        return (<>
                  <option value={datum.type+"-"+datum.id} >{datum.album+" - "+datum.artist}</option>
                </>);
      default:
        console.log("render",datum);
        
        if(!checkProp(datum,"title") && !checkProp(datum,"album") && checkProp(datum,"artist"))
          return (<>
                  <option value={type.indexOf["artist"]+"-"+datum.id} >{datum.artist}</option>
                </>);
        if(checkProp(datum,"title") && checkProp(datum,"album") && checkProp(datum,"artist"))
          
          return (<>
                  <option value={type.indexOf["song"]+"-"+datum.id} >{datum.title+" - "+datum.album+" - "+datum.artist}</option>
                </>);
        if(!checkProp(datum,"title") && checkProp(datum,"album") && checkProp(datum,"artist"))
          return (<>
                  <option value={type.indexOf["album"]+"-"+datum.id} >{datum.album+" - "+datum.artist}</option>
                </>);

        if(checkProp(datum,"title") && !checkProp(datum,"album") && checkProp(datum,"artist"))
          return (<>
                  <option value={type.indexOf["album"]+"-"+datum.id} >{datum.title+" - "+datum.artist}</option>
                </>);        

        return (<></>);
          
    }
  };

  const renderOptions=()=>{
    //datum:DynamicProps
    //console.log(props.dataShow,props.dataShow instanceof Array)
    if(props.dataShow instanceof Array) //Array json
      if (props.dataShow.length)
        return props.dataShow.map(render);
      else
        return (<></>);
    else if (props.dataShow.hasOwnProperty("id"))//single json
          {
            //console.log("Object",props.dataShow.hasOwnProperty("id"));
            return render(props.dataShow);}
         else
          return (<></>);

  };
  //console.log(props.dataShow.length ?1 :2);
  //if(props.dataShow.length>0)setDply("block"); else setDply("none");
    
  return (
          <>
          <select className="select-suggestion" onChange={handleSelect} style={{display:dply}}>
            {renderOptions()}
          </select> 
          </>
      );

  //{props.dataShow.map(renderOptions)}
}

export default ShowBox;


