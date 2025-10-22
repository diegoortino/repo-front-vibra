import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheckCircle, faTimesCircle} from "@fortawesome/free-regular-svg-icons"
import { faExclamationCircle} from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"
import "./Notification.css"

type NotificationProps={
    type:"success"| "warning" | "error",
    message:string
}
export function Notification({type, message}:NotificationProps){
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const hideTimer = setTimeout(() => setVisible(false), 3000);

        return () => {
            clearTimeout(hideTimer);
        };
    }, [message]);

    const icon = type === "success" ? faCheckCircle : type === "warning" ? faExclamationCircle : faTimesCircle;

    return(
        <div className={`notificationContainer ${visible ? "show" : ""}`}>
            <div className={`notification ${type}`}>
                <FontAwesomeIcon className={`icon ${type}`} icon={icon}/>
                <p>{message}</p>
            </div>
        </div>
    )
}