package jk.kamoru.flayground.info.service;

import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Studio;

@Service
public class StudioInfoService extends InfoServiceAdapter<Studio, String> {

	@Autowired FlayService flayService;

	public Studio findOneByOpus(String opus) {
		String query = StringUtils.substringBeforeLast(opus, "-");
		if (StringUtils.isBlank(query)) {
			return new Studio();
		}
		
		List<Flay> list = flayService.list()
				.stream()
				.filter(f -> f.getOpus().contains(query))
				.sorted((f1, f2) -> NumberUtils.compare(f2.getLastModified(), f1.getLastModified()))
				.collect(Collectors.toList());
		if (list.size() > 0) {
			return super.getOrNew(list.get(0).getStudio());
		} else {
			return new Studio();
		}
	}
}
