interface ILogger
{
    emergency(msg: string) : void
    
    alert(msg: string) : void
    
    critical(msg: string) : void
    
    error(msg: string) : void
    
    warning(msg: string) : void
    
    notice(msg: string) : void
    
    info(msg: string) : void
    
    debug(msg: string) : void
    
    log(level: string, msg: string) : void
}

export default ILogger