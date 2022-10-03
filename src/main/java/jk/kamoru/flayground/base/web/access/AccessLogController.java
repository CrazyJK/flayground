package jk.kamoru.flayground.base.web.access;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.condition.PathPatternsRequestCondition;
import org.springframework.web.servlet.mvc.condition.RequestMethodsRequestCondition;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import jk.kamoru.flayground.base.web.access.domain.AccessLogStatistic;
import jk.kamoru.flayground.base.web.access.service.AccessLogService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
      RequestMappingInfo requestMappingInfo = entry.getKey();
      HandlerMethod handlerMethod = entry.getValue();

      PathPatternsRequestCondition pathPatternsCondition = requestMappingInfo.getPathPatternsCondition();
      RequestMethodsRequestCondition methodsCondition = requestMappingInfo.getMethodsCondition();

      if (pathPatternsCondition == null || methodsCondition == null) {
        log.info("requestMappingInfo: {}", requestMappingInfo);
        log.info("     handlerMethod: {}", handlerMethod);
        log.debug("requestMappingInfo.getActivePatternsCondition: {}", requestMappingInfo.getActivePatternsCondition());
        log.debug("requestMappingInfo.getConsumesCondition:       {}", requestMappingInfo.getConsumesCondition());
        log.debug("requestMappingInfo.getDirectPaths:             {}", requestMappingInfo.getDirectPaths());
        log.debug("requestMappingInfo.getHeadersCondition:        {}", requestMappingInfo.getHeadersCondition());
        log.debug("requestMappingInfo.getMethodsCondition:        {}", requestMappingInfo.getMethodsCondition());
        log.debug("requestMappingInfo.getParamsCondition:         {}", requestMappingInfo.getParamsCondition());
        log.debug("requestMappingInfo.getPathPatternsCondition:   {}", requestMappingInfo.getPathPatternsCondition());
        log.debug("requestMappingInfo.getPatternValues:           {}", requestMappingInfo.getPatternValues());
        log.debug("requestMappingInfo.getPatternsCondition:       {}", requestMappingInfo.getPatternsCondition());
        log.debug("requestMappingInfo.getProducesCondition:       {}", requestMappingInfo.getProducesCondition());
        continue;
      }

      String beanType = StringUtils.substringAfterLast(handlerMethod.getBeanType().getName(), ".");
      String beanMethod = handlerMethod.getMethod().getName();

      Optional<AccessLogStatistic> found = accessLogService.find(beanType + "." + beanMethod);
      long callCount = found.isPresent() ? found.get().getCallCount() : 0;
      long lastAccess = found.isPresent() && found.get().getLastAccess() != null ? found.get().getLastAccess().getTime() : 0;

      Map<String, String> mappingData = new HashMap<>();
      mappingData.put("reqPattern", StringUtils.substringBetween(pathPatternsCondition.toString(), "[", "]"));
      mappingData.put("reqMethod", StringUtils.substringBetween(methodsCondition.toString(), "[", "]"));
      mappingData.put("beanType", beanType);
      mappingData.put("beanMethod", beanMethod);
      mappingData.put("callCount", String.valueOf(callCount));
      mappingData.put("lastAccess", String.valueOf(lastAccess));
      mappingList.add(mappingData);
    }
    return mappingList;
  }

}
