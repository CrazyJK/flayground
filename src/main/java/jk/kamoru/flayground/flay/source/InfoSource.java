package jk.kamoru.flayground.flay.source;

import java.util.List;

import jk.kamoru.flayground.flay.domain.info.Info;

public interface InfoSource<T extends Info> {

	List<T> getList();
	
	T get(long id);
	
	void create(T createT);
	
	void update(T updateT);

	void delete(T deleteT);
	
}
