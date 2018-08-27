package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Video;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/video")
public class VideoController {

	@Autowired FlayService<Video> videoService;
	
	@GetMapping("/{opus}")
	public Video getVideo(@PathVariable String opus) {
		return videoService.get(opus);
	}
	
	@GetMapping("/list")
	public Collection<Video> getList(@RequestBody Search search) {
		return videoService.getList(search);
	}
}
