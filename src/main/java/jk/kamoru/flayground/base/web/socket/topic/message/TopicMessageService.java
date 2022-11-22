package jk.kamoru.flayground.base.web.socket.topic.message;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.MESSAGE;
import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.TOPIC_MESSAGE;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.base.web.socket.PayLoad;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class TopicMessageService {

  @Autowired SimpMessagingTemplate messagingTemplate;

  public void sendFromServerToCurrentUser(String subject, String body) {
    User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    send(subject, body, PayLoad.SERVER, user.getUsername());
  }

  public void sendFromServerToAll(String subject, String body) {
    send(subject, body, PayLoad.SERVER, null);
  }

  public void sendFromServerTo(String subject, String body, String to) {
    send(subject, body, PayLoad.SERVER, to);
  }

  public void send(String subject, String body, String from, String to) {
    log.info("send {}: {} from {} to {}", subject, body, from, to);
    if (StringUtils.isBlank(to)) {
      messagingTemplate.convertAndSend(TOPIC_MESSAGE, PayLoad.builder().type(MESSAGE).from(from).subject(subject).body(body).build());
    } else {
      messagingTemplate.convertAndSendToUser(to, TOPIC_MESSAGE, PayLoad.builder().type(MESSAGE).from(from).to(to).subject(subject).body(body).build());
    }
  }

}
