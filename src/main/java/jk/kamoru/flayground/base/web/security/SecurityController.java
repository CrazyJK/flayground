package jk.kamoru.flayground.base.web.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jk.kamoru.flayground.FlayProperties;

@RestController
@RequestMapping("/security")
public class SecurityController {

  @Autowired SecurityService securityService;
  @Autowired FlayProperties flayProperties;

  @GetMapping("/whoami")
  public Object getUser() {
    return securityService.getUser();
  }

  @GetMapping("/isAutomaticallyCertificated")
  public boolean isAutomaticallyCertificated(HttpServletRequest request) {
    return flayProperties.getAutomaticallyCertificatedIp().contains(request.getRemoteAddr());
  }

}
