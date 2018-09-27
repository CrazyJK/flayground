package jk.kamoru.flayground.notice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.notice.service.NotificationService;

@RestController
@RequestMapping("/notice")
public class NoticePusher {

	@Autowired NotificationService notificationService;
	
	@GetMapping("/push/{title}/{content}")
	public void push(@PathVariable String title, @PathVariable String content) {
		notificationService.announce(title, content);
	}

}
