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
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.service.ActressInfoService;

@RestController
@RequestMapping("/info/actress")
public class ActressController {

	@Autowired ActressInfoService actressInfoService;
	
	@GetMapping("/{name}")
	public Actress get(@PathVariable String name) {
		return actressInfoService.get(name);
	}
	
	@GetMapping("/list")
	public Collection<Actress> list() {
		return actressInfoService.list();
	}

	@GetMapping("/find")
	public Collection<Actress> find(@ModelAttribute Search search) {
		return actressInfoService.find(search);
	}

	@PostMapping
	public void create(@ModelAttribute Actress actress) {
		actressInfoService.create(actress);
	}
	
	@PatchMapping
	public void update(@ModelAttribute Actress actress) {
		actressInfoService.update(actress);
	}
	
	@DeleteMapping
	public void delete(@ModelAttribute Actress actress) {
		actressInfoService.delete(actress);
	}

}
