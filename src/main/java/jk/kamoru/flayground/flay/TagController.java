package jk.kamoru.flayground.flay;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.info.TagInfo;
import jk.kamoru.flayground.flay.source.TagInfoSource;

@RestController
@RequestMapping("/flay/tag")
public class TagController {

	@Autowired TagInfoSource tagInfoSource;
	
	@GetMapping
	public List<TagInfo> getList() {
		return tagInfoSource.getList();
	}
	
}
