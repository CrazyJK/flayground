package jk.kamoru.flayground.base.web.socket.notice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.base.web.socket.WebSocketConfig;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AnnounceService {

	@Autowired SimpMessagingTemplate messagingTemplate;

	public void announce(String title, String content) {
		log.debug("announce {} {}", title, content);
		try {
			messagingTemplate.convertAndSend(WebSocketConfig.TOPIC_ANNOUNCE, new Notice(title, content));
		} catch (Exception e) {
			log.error("fail to announce: " + e.getMessage(), e);
		}
	}

	public void announceTo(String title, String content) {
		User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
		announceTo(title, content, user.getUsername());
	}

	public void announceTo(String title, String content, String user) {
		log.debug("announce {} {} -> {}", title, content, user);
		try {
			messagingTemplate.convertAndSendToUser(user, WebSocketConfig.TOPIC_ANNOUNCE, new Notice(title, content));
		} catch (Exception e) {
			log.error("fail to announce: " + e.getMessage(), e);
		}
	}

}
