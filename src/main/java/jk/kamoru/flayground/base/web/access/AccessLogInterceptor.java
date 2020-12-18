package jk.kamoru.flayground.base.web.access;

import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jk.kamoru.flayground.base.web.access.domain.AccessLog;
import jk.kamoru.flayground.base.web.access.service.AccessLogService;
import lombok.extern.slf4j.Slf4j;

/**
 * handler 완료 시점에 accesslog형식으로 기록한다.
 * <pre>
 *  public void addInterceptors(InterceptorRegistry registry) {
 *      registry.addInterceptor(new HandlerAccessLogger(accessLogService));
 *  }
 * </pre>
 * @author kamoru
 */
@Slf4j
public class AccessLogInterceptor implements HandlerInterceptor {

	private static final String MDC_STARTTIME = "StartTime";
	private static final String MDC_USERNAME  = "Username";

	AccessLogService accessLogService;

	public AccessLogInterceptor(AccessLogService accessLogService) {
		this.accessLogService = accessLogService;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		MDC.put(MDC_STARTTIME, Long.toString(System.currentTimeMillis()));
		MDC.put(MDC_USERNAME, getUsername());
		return true;
	}

	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
		String startTime = StringUtils.defaultString(MDC.get(MDC_STARTTIME), Long.toString(System.currentTimeMillis()));
		Date   logDate     = new Date();
		String remoteAddr  = request.getRemoteAddr();
		String reqMethod   = request.getMethod();
		String requestUri  = request.getRequestURI();
		String contentType = StringUtils.defaultString(response.getContentType());
		long   elapsedtime = System.currentTimeMillis() - Long.parseLong(startTime);
		String handlerInfo = "";
		String exceptionInfo = ex == null ? "" : ex.getMessage();
		String username    = getUsername();
		int    status      = response.getStatus();

		// for handlerInfo
		if (handler instanceof org.springframework.web.method.HandlerMethod) { // for Controller
			HandlerMethod method = (HandlerMethod) handler;
			handlerInfo = String.format("%s.%s", method.getBean().getClass().getSimpleName(), method.getMethod().getName());
		}
		else if (handler instanceof org.springframework.web.servlet.resource.ResourceHttpRequestHandler) { // for static resources. No additional information
			// do nothing
		}
		else { // another handler
			handlerInfo = String.format("%s", handler);
		}

		if (contentType.startsWith("image")
				|| handlerInfo.startsWith("ImageRequestHandler")
				|| requestUri.startsWith("/js")
				|| requestUri.startsWith("/css")
				|| requestUri.startsWith("/webjars")) {
			return;
		}

		AccessLog accessLog = new AccessLog(logDate, remoteAddr, reqMethod, requestUri, contentType, elapsedtime, handlerInfo, exceptionInfo, username, status);

		if (log.isDebugEnabled()) {
			log.debug(accessLog.toConsoleLogString());
		}

		if (!StringUtils.isBlank(accessLog.handlerInfo)) {
			accessLogService.increaseCallCount(accessLog.handlerInfo);
		}

		MDC.clear();
	}

	private String getUsername() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null)
			return authentication.getName();
		return "";
	}

}
