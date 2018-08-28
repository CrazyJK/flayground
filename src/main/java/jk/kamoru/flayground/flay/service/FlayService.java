package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;

public interface FlayService<T> {

	Collection<T> getList(Search search);
	
	T get(String key);

//	T update(T domain);

}
