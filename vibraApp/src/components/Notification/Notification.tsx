import { useEffect, useState } from "react"
import { Icons } from "../Icons"

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

    const renderIcon = () => {
        if (type === "success") return <Icons.CheckCircleOutline className={`icon ${type}`} />;
        if (type === "warning") return <Icons.ExclamationCircle className={`icon ${type}`} />;
        return <Icons.TimesCircleOutline className={`icon ${type}`} />;
    };

    return(
        <div className={`notificationContainer ${visible ? "show" : ""}`}>
            <div className={`notification ${type}`}>
                {renderIcon()}
                <p>{message}</p>
            </div>
        </div>
    )
}
