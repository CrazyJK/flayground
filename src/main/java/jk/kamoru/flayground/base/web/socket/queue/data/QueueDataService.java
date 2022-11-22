package jk.kamoru.flayground.base.web.socket.queue.data;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.DATA;
import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.QUEUE_DATA;
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
public class QueueDataService {

  @Autowired SimpMessagingTemplate messagingTemplate;

  public void queue(QueueData queueData) {
    queue(queueData.getBody(), queueData.getFrom(), queueData.getTo());
  }

  public void queueFromServerToCurrentUser(String body) {
    User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    queue(body, PayLoad.SERVER, user.getUsername());
  }

  public void queue(String body, String from, String to) {
    log.info("queue: {} from {} to {}", body, from, to);
    if (StringUtils.isBlank(to)) {
      messagingTemplate.convertAndSend(QUEUE_DATA, PayLoad.builder().type(DATA).from(from).body(body).build());
    } else {
      messagingTemplate.convertAndSendToUser(to, QUEUE_DATA, PayLoad.builder().type(DATA).from(from).to(to).body(body).build());
    }
  }

}
