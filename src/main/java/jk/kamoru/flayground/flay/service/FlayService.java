package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.domain.info.Actress;
import jk.kamoru.flayground.flay.domain.info.Tag;

public interface FlayService {

	Collection<Flay> getFlayList(Search search);
	
	Flay getFlay(String key);

	Collection<Actress> getActressList(Search search);

	Actress getActress(String name);

	Collection<Tag> getTagList();

	Actress getTag(String name);

}
