package jk.kamoru.flayground.base.web.security.authentication;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayAuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

  @Override
  public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
    String accept = request.getHeader("accept");
    log.debug("header - accept: {}", accept);

    if (accept.matches(".*application/json.*")) {
      FlayAuthenticationJsonResponse failureResponse = new FlayAuthenticationJsonResponse(false, null, null, exception);
      FlayAuthenticationJsonResponse.sendResponse(response, failureResponse);
      log.info("login failure - error: {}", exception.getMessage());
    } else {
      super.onAuthenticationFailure(request, response, exception);
    }
  }

}
