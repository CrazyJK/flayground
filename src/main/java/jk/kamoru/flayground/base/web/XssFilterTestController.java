package jk.kamoru.flayground.base.web;

import java.util.Arrays;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/xss")
public class XssFilterTestController {

	@RequestMapping("/test")
	@ResponseBody
	public String test(HttpServletRequest request) {
		StringBuilder response = new StringBuilder("<ol>");

		for (Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
			response.append("<li>").append(entry.getKey()).append(" : ").append(Arrays.toString(entry.getValue())).append("</li>");
		}

		response.append("<ol>");

		return response.toString();
	}

}
