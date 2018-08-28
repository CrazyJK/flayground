package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.flay.domain.info.Info;

public abstract class JsonInfoSource<T extends Info> implements InfoSource<T> {

	List<T> list;

	abstract File getInfoFile();

	void load() {
		File infoFile = getInfoFile();
		ObjectMapper mapper = new ObjectMapper();
		try {
			list = mapper.readValue(infoFile, new TypeReference<List<T>>() {});
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}	
	}
	
	@Override
	public List<T> getList() {
		return list;
	}

	@Override
	public T get(long id) {
		for (T t : list) {
			if (t.getId() == id) {
				return t;
			}
		}
		throw new InfoNotfoundException(id);
	}

	@Override
	public void create(T createT) {
		createT.setId(nextId());
		list.add(createT);
		save();
	}

	@Override
	public void update(T updateT) {
		T t = get(updateT.getId());
		list.remove(t);
		list.add(t);
		save();
	}

	@Override
	public void delete(T deleteT) {
		T t = get(deleteT.getId());
		list.remove(t);
		save();
	}

	private void save() {
		ObjectMapper mapper = new ObjectMapper();
		try {
			mapper.writeValue(getInfoFile(), list);
		} catch (IOException e) {
			throw new IllegalStateException("Fail to save info file " + getInfoFile(), e);
		}
	}

	private long nextId() {
		long next = 0;
		for (T t : list) {
			if (next < t.getId()) {
				next = t.getId() + 1;
			}
		}
		return next;
	}


}
