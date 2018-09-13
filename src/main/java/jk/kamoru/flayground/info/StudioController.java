package jk.kamoru.flayground.info;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.info.domain.Studio;
import jk.kamoru.flayground.info.service.StudioInfoService;

@RestController
@RequestMapping("/info/studio")
public class StudioController {

	@Autowired StudioInfoService studioInfoService;
	
	@GetMapping("/{name}")
	public Studio get(@PathVariable String name) {
		return studioInfoService.get(name);
	}
	
	@GetMapping("/list")
	public Collection<Studio> list() {
		return studioInfoService.list();
	}

	@GetMapping("/find")
	public Collection<Studio> find(@ModelAttribute Search search) {
		return studioInfoService.find(search);
	}

	@GetMapping("/findByOpus")
	public Studio findByOpus(@ModelAttribute Search search) {
		return studioInfoService.findOneByOpus(search);
	}

	@PostMapping
	public Studio create(@RequestBody Studio studio) {
		return studioInfoService.create(studio);
	}
	
	@PatchMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void update(@RequestBody Studio studio) {
		studioInfoService.update(studio);
	}
	
	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@RequestBody Studio studio) {
		studioInfoService.delete(studio);
	}

}
