package jk.kamoru.flayground.base.web.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/security")
public class SecurityController {

	@GetMapping("/whoami")
	public Object getUser() {
		return SecurityContextHolder.getContext().getAuthentication().getPrincipal();
	}

}
