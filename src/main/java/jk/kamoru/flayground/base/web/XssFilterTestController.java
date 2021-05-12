package jk.kamoru.flayground.base.web;

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
		String response = "";

		String parameter = request.getParameter("test");

		response += "test=" + parameter;

		System.out.println("response: " + response);

		return response;
	}

}
