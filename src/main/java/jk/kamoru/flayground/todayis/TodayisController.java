package jk.kamoru.flayground.todayis;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.todayis.domain.Todayis;
import jk.kamoru.flayground.todayis.service.TodayisService;

@RestController
@RequestMapping("/todayis")
public class TodayisController {

	@Autowired TodayisService todayisService;
	
	@GetMapping("/list")
	public Collection<Todayis> getList() {
		return todayisService.list();
	}

	@PatchMapping("/play")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void play(@RequestBody Todayis todayis) {
		todayisService.play(todayis);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@RequestBody Todayis todayis) {
		todayisService.delete(todayis);
	}
	
}
