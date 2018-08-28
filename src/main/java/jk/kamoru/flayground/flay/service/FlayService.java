package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Studio;

public interface FlayService<T> {

	Collection<T> getList(Search search);
	
	T get(String key);

	T update(T domain);

}
