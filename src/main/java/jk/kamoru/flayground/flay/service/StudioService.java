package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class StudioService implements FlayService<Studio> {

	@Autowired FlaySource instanceFlaySource;

	@Override
	public Collection<Studio> getList(Search search) {
		return instanceFlaySource.getStudioList().stream().filter(s -> {
			return search.contains(s);
		}).collect(Collectors.toList());
	}

	@Override
	public Studio get(String name) {
		return instanceFlaySource.getStudio(name);
	}

}
