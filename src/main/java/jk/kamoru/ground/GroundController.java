package jk.kamoru.ground;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.base.util.EmailUtil;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Ground")
@RestController
@RequestMapping(Ground.API_PREFIX)
public class GroundController {

  @Autowired
  GroundProperties properties;

  @GetMapping("/config")
  public Map<String, Object> config() throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {
    Map<String, Object> propertiesMap = new HashMap<>();
    for (Method method : GroundProperties.class.getMethods()) {
      final String methodName = method.getName();
      if (methodName.startsWith("get")) {
        String key = StringUtils.uncapitalize(methodName.substring(3));
        Object val = method.invoke(properties);
        propertiesMap.put(key, val);
      } else if (methodName.startsWith("is")) {
        String key = StringUtils.uncapitalize(methodName.substring(2));
        Object val = method.invoke(properties);
        propertiesMap.put(key, val);
      }
    }
    return propertiesMap;
  }

  /**
   * 이메일 주소를 도메인별로 정렬합니다.
   *
   * @param request 이메일 주소가 포함된 텍스트
   * @return 정렬된 이메일 목록과 쉼표로 구분된 문자열
   */
  @PostMapping("/util/email/sort")
  public Map<String, Object> sortEmails(@RequestBody Map<String, String> request) {
    String text = request.get("text");
    
    List<String> emails = EmailUtil.extractEmails(text);
    List<String> sortedEmails = EmailUtil.sortByDomain(emails);
    String joined = EmailUtil.joinWithComma(sortedEmails);
    
    Map<String, Object> response = new HashMap<>();
    response.put("original", text);
    response.put("emails", sortedEmails);
    response.put("joined", joined);
    response.put("count", sortedEmails.size());
    
    return response;
  }

}
