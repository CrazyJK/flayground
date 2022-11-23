package jk.kamoru.flayground.base.web.socket.queue.data;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.DATA;
import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.QUEUE_DATA;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import jk.kamoru.flayground.base.web.security.SecurityService;
import jk.kamoru.flayground.base.web.socket.PayLoad;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class QueueDataService {

  @Autowired SimpMessagingTemplate messagingTemplate;

  @Autowired SecurityService securityService;

  public void queueFromServerToCurrentUser(String mode, String data) {
    queue(new ServerQueue(mode, data), PayLoad.SERVER, securityService.getUsername());
  }

  public void queueFromServerToCurrentUser(Object content) {
    queue(content, PayLoad.SERVER, securityService.getUsername());
  }

  public void queueFromServerTo(Object content, String to) {
    queue(content, PayLoad.SERVER, to);
  }

  public void queue(Object content, String from, String to) {
    log.info("queue: [{}] from [{}] to [{}]", content, from, to);
    if (StringUtils.isBlank(to)) {
      messagingTemplate.convertAndSend(QUEUE_DATA, PayLoad.builder().type(DATA).from(from).content(content).build());
    } else {
      messagingTemplate.convertAndSendToUser(to, QUEUE_DATA,
          PayLoad.builder().type(DATA).from(from).to(to).content(content).build());
    }
  }

}
