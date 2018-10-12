package jk.kamoru.flayground.web.access;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import jk.kamoru.flayground.web.access.service.AccessLogService;

@RestController
@RequestMapping("/accesslog")
public class AccessLogController {

	@Autowired ApplicationContext context;
	@Autowired AccessLogService accessLogService;

	@GetMapping("/requestMappingList")
	public List<Map<String, String>> requestMapping(Model model) {
		List<Map<String, String>> mappingList = new ArrayList<>();
		RequestMappingHandlerMapping rmhm = context.getBean(RequestMappingHandlerMapping.class);
		for (Entry<RequestMappingInfo, HandlerMethod> entry : rmhm.getHandlerMethods().entrySet()) {
			String beanType   = StringUtils.substringAfterLast(entry.getValue().getBeanType().getName(), ".");
			String beanMethod = entry.getValue().getMethod().getName();
			long   callCount  = accessLogService.countByHandler(beanType + "." + beanMethod);

			Map<String, String> mappingData = new HashMap<>();
			mappingData.put("reqPattern", StringUtils.substringBetween(entry.getKey().getPatternsCondition().toString(), "[", "]"));
			mappingData.put("reqMethod",  StringUtils.substringBetween(entry.getKey().getMethodsCondition().toString(), "[", "]"));
			mappingData.put("beanType",   beanType);
			mappingData.put("beanMethod", beanMethod);
			mappingData.put("callCount",  String.valueOf(callCount));
			mappingList.add(mappingData);
		}		
		return mappingList;
	}

}
