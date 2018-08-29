package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.domain.info.Actress;
import jk.kamoru.flayground.flay.domain.info.Tag;
import jk.kamoru.flayground.flay.source.FlaySource;

public class FlayServiceImpl implements FlayService {

	@Autowired FlaySource flaySource;
	
	@Override
	public Collection<Flay> getFlayList(Search search) {
		return flaySource.getList().stream().filter(f -> {
			return search.contains(f);
		}).collect(Collectors.toList());
	}

	@Override
	public Flay getFlay(String key) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Collection<Actress> getActressList(Search search) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Actress getActress(String name) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Collection<Tag> getTagList() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Actress getTag(String name) {
		// TODO Auto-generated method stub
		return null;
	}

}
