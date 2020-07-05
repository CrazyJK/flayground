package jk.kamoru.flayground.info;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.FlayProperties;

@RestController
@RequestMapping("/config")
public class ConfigController {

	@Autowired FlayProperties flayProperties;

	@GetMapping
	public Map<String, Object> show() throws IllegalAccessException, IllegalArgumentException, InvocationTargetException {
		Map<String, Object> propertiesMap = new HashMap<>();
		for (Method method : FlayProperties.class.getMethods()) {
			if (method.getName().startsWith("get")) {
				propertiesMap.put(StringUtils.uncapitalize(method.getName().substring(3)), method.invoke(flayProperties));
			}
		}
		return propertiesMap;
	}

}
