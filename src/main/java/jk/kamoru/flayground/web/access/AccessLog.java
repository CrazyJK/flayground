package jk.kamoru.flayground.base.access;

import java.util.Date;

import lombok.Data;

@Data
public class AccessLog {

	public Long id;
    public Date accessDate;
    public String remoteAddr;
    public String method;
    public String requestURI;
    public String contentType;
    public Long elapsedTime;
    public String handlerInfo;
    public String exceptionInfo;
	public String username;
    public Integer status;
    
	public AccessLog(Date accessDate, String remoteAddr, String method, String requestURI, String contentType, Long elapsedTime, String handlerInfo, String exceptionInfo, String username, Integer status) {
		this.accessDate = accessDate;
		this.remoteAddr = remoteAddr;
		this.method = method;
		this.requestURI = requestURI;
		this.contentType = contentType;
		this.elapsedTime = elapsedTime;
		this.handlerInfo = handlerInfo;
		this.exceptionInfo = exceptionInfo;
		this.username = username;
		this.status = status;
	}

	public String toConsoleLogString() {
		return String.format("%s - %4sms - %-5s - %-30s [%s] [%s] %s", status, elapsedTime, method, requestURI, contentType, handlerInfo, exceptionInfo);
	}
 
}