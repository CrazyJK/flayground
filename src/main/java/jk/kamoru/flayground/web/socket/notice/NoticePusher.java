package jk.kamoru.flayground.web.notice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.web.notice.service.NotificationService;

@RestController
public class NoticePusher {

	@Autowired NotificationService notificationService;
	
	@GetMapping("/notice/push/{title}/{content}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void push(@PathVariable String title, @PathVariable String content) {
		notificationService.announce(title, content);
	}

}
