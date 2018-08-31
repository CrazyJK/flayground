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
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.service.TagInfoService;

@RestController
@RequestMapping("/info/tag")
public class TagController {

	@Autowired TagInfoService tagInfoService;
	
	@GetMapping("/{name}")
	public Tag get(@PathVariable String name) {
		return tagInfoService.get(name);
	}
	
	@GetMapping("/list")
	public Collection<Tag> list() {
		return tagInfoService.list();
	}
	
	@GetMapping("/find")
	public Collection<Tag> find(Search search) {
		return tagInfoService.find(search);
	}

	@PostMapping
	public void create(@ModelAttribute Tag tag) {
		tagInfoService.create(tag);
	}
	
	@PatchMapping
	public void update(@ModelAttribute Tag tag) {
		tagInfoService.update(tag);
	}
	
	@DeleteMapping
	public void delete(@ModelAttribute Tag tag) {
		tagInfoService.delete(tag);
	}

}
