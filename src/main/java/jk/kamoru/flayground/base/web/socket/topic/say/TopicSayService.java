package jk.kamoru.flayground.base.web.socket.topic.say;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.SAY;
import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.TOPIC_SAY;
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
public class TopicSayService {

  @Autowired SimpMessagingTemplate messagingTemplate;

  /**
   * 서버에서 전달하는 대화
   * @param topicSay
   */
  public void sayFromServer(TopicSay topicSay) {
    sayFrom(topicSay, PayLoad.SERVER);
  }

  /**
   * 사용자간 대화
   * @param topicSay
   */
  public void say(TopicSay topicSay) {
    User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    sayFrom(topicSay, user.getUsername());
  }

  /**
   * 메시징 구현.
   * 공개인지 개인인지는 {@link TopicSay#to} 로 구분
   * @param topicSay
   * @param from
   */
  private void sayFrom(TopicSay topicSay, String from) {
    log.debug("say: {} from {}", topicSay, from);
    final String to = topicSay.getTo();
    if (StringUtils.isBlank(to)) {
      messagingTemplate.convertAndSend(TOPIC_SAY, PayLoad.builder().type(SAY).from(from).body(topicSay.getContent()).build());
    } else {
      messagingTemplate.convertAndSendToUser(to, TOPIC_SAY, PayLoad.builder().type(SAY).from(from).to(to).body(topicSay.getContent()).build());
    }
  }

}
