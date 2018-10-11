package jk.kamoru.flayground;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@RestController
public class FlaygroundController {

	@Autowired ApplicationContext context;
	@Autowired AccessLogRepository accessLogRepository;

	@GetMapping("/requestMappingList")
	public List<Map<String, String>> requestMapping(Model model) {
		List<Map<String, String>> mappingList = new ArrayList<>();
		RequestMappingHandlerMapping rmhm = context.getBean(RequestMappingHandlerMapping.class);
		for (Entry<RequestMappingInfo, HandlerMethod> entry : rmhm.getHandlerMethods().entrySet()) {
			String beanType = StringUtils.substringAfterLast(entry.getValue().getBeanType().getName(), ".");
			String beanMethod = entry.getValue().getMethod().getName();
			long callCount = accessLogRepository.countByHandlerInfo(beanType + "." + beanMethod);

			Map<String, String> mappingData = new HashMap<>();
			mappingData.put("reqPattern", StringUtils.substringBetween(entry.getKey().getPatternsCondition().toString(), "[", "]"));
			mappingData.put("reqMethod",  StringUtils.substringBetween(entry.getKey().getMethodsCondition().toString(), "[", "]"));
			mappingData.put("beanType",   beanType);
			mappingData.put("beanMethod", beanMethod);
			mappingData.put("callCount", String.valueOf(callCount));
			mappingList.add(mappingData);
		}		
		return mappingList;
	}

	@GetMapping("/whoami")
	public Object getUser() {
		return SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}
	
}
