package jk.kamoru.flayground.flay.source.info;

import java.util.List;

import jk.kamoru.flayground.flay.domain.info.Info;

public interface InfoSource<T extends Info<K>, K> {

	List<T> getList();
	
	T get(K key);

	T getOrNew(K key);

	void create(T createT);
	
	void update(T updateT);

	void delete(T deleteT);
	
}
