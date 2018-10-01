package jk.kamoru.flayground.info.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;

@Service
public class SummaryServiceImpl implements SummaryService {

	@Autowired FlayService flayService;

	@Override
	public Map<String, List<Flay>> groupByRelease(String pattern) {
		Map<String, List<Flay>> data = new TreeMap<>();
		Collection<Flay> list = flayService.list();
		for (Flay flay : list) {
			String key = getReleasePattern(flay.getRelease(), pattern);
			if (!data.containsKey(key)) {
				data.put(key, new ArrayList<Flay>());
			}
			data.get(key).add(flay);
		}

		return data;
	}

	private String getReleasePattern(String release, String pattern) {
		if ("YYYY".equals(pattern)) {
			return release.substring(0, 4);
		} else if ("YYYYMM".equals(pattern)) {
			return release.substring(0, 7);
		} else if ("YYYYMMDD".equals(pattern)) {
			return release;
		} else {
			throw new IllegalArgumentException("unknown release pattern");
		}
	}
}
