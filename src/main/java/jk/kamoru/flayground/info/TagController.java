package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.info.Tag;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay/tag")
public class TagController {

	@Autowired FlayService flayService;
	
	@GetMapping("/{name}")
	public Tag get(@PathVariable String name) {
		return flayService.getTag(name);
	}
	
	@GetMapping("/list")
	public Collection<Tag> getList() {
		return flayService.getTagList();
	}
	
}
