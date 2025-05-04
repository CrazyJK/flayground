package jk.kamoru.ground;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
