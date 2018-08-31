package jk.kamoru.flayground.info;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.VideoInfoService;

@RestController
@RequestMapping("/info/video")
public class VideoController {

	@Autowired VideoInfoService videoInfoService;
	
	@GetMapping("/{opus}")
	public Video get(@PathVariable String opus) {
		return videoInfoService.get(opus);
	}
	
	@GetMapping("/list")
	public Collection<Video> list() {
		return videoInfoService.list();
	}
	
	@GetMapping("/find")
	public Collection<Video> find(Search search) {
		return videoInfoService.find(search);
	}

	@PostMapping
	public void create(@ModelAttribute Video video) {
		videoInfoService.create(video);
	}
	
	@PatchMapping
	public void update(@ModelAttribute Video video) {
		videoInfoService.update(video);
	}
	
	@DeleteMapping
	public void delete(@ModelAttribute Video video) {
		videoInfoService.delete(video);
	}

}
