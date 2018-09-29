package jk.kamoru.flayground.info;

import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.service.ActressInfoService;
import jk.kamoru.flayground.info.service.NameDistanceChecker.CheckResult;

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

	@GetMapping("/find/{query}")
	public Collection<Actress> find(@PathVariable String query) {
		return actressInfoService.find(query);
	}

	@GetMapping("/find/byLocalname/{localname}")
	public Collection<Actress> findByLocalname(@PathVariable String localname) {
		return actressInfoService.findByLocalname(localname);
	}

	@GetMapping("/func/nameCheck/{limit}")
	public List<CheckResult> funcNameCheck(@PathVariable double limit) {
		return actressInfoService.funcNameCheck(limit);
	}

	@PostMapping
	public Actress create(@RequestBody Actress actress) {
		return actressInfoService.create(actress);
	}
	
	@PatchMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void update(@RequestBody Actress actress) {
		actressInfoService.update(actress);
	}

	@PutMapping("/{name}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void rename(@PathVariable String name, @RequestBody Actress actress) {
		actressInfoService.rename(actress, name);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@RequestBody Actress actress) {
		actressInfoService.delete(actress);
	}

}
