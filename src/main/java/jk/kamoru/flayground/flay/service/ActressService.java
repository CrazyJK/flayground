package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class ActressService implements FlayService<Actress> {

	@Autowired FlaySource instanceFlaySource;

	@Override
	public Collection<Actress> getList(Search search) {
		return instanceFlaySource.getActressList().stream().filter(a -> {
			return search.contains(a);
		}).collect(Collectors.toList());
	}

	@Override
	public Actress get(String name) {
		return instanceFlaySource.getActress(name);
	}

}
