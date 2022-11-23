package jk.kamoru.flayground.base.web.socket.topic.say;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.SAY;
import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.TOPIC_SAY;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.base.web.security.SecurityService;
import jk.kamoru.flayground.base.web.socket.PayLoad;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class TopicSayService {

  @Autowired SimpMessagingTemplate messagingTemplate;

  @Autowired SecurityService securityService;

  /**
   * 서버에서 전달하는 대화
   *
   * @param topicSay
   */
  public void sayFromServerToAll(String message) {
    say(message, PayLoad.SERVER, null);
  }

  public void sayFromServerToCurrentUser(String message) {
    say(message, PayLoad.SERVER, securityService.getUsername());
  }

  /**
   * 메시징 구현.
   *
   * @param message
   * @param from
   * @param to
   */
  public void say(String message, String from, String to) {
    log.debug("say: [{}] from [{}] to [{}]", message, from, to);
    if (StringUtils.isBlank(to)) {
      messagingTemplate.convertAndSend(TOPIC_SAY, PayLoad.builder().type(SAY).from(from).content(message).build());
    } else {
      messagingTemplate.convertAndSendToUser(to, TOPIC_SAY,
          PayLoad.builder().type(SAY).from(from).to(to).content(message).build());
    }
  }

}
