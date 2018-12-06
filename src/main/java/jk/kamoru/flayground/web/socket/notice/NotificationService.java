package jk.kamoru.flayground.web.notice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.web.notice.WebSocketConfig;
import jk.kamoru.flayground.web.notice.domain.Notice;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NotificationService {
	
	@Autowired SimpMessagingTemplate messagingTemplate;
	
	public void announce(String title, String content) {
		try {
			messagingTemplate.convertAndSend(WebSocketConfig.DESTINATION_ANNOUNCE_LISTEN, new Notice(title, content));
		} catch (Exception e) {
			log.error("fail to announce: " + e.getMessage(), e);
		}
	}

}
