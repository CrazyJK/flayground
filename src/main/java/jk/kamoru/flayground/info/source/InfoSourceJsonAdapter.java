package jk.kamoru.flayground.flay.source.info;

import java.io.File;
import java.io.IOException;
import java.util.List;

import javax.annotation.PostConstruct;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.flay.InfoNotfoundException;
import jk.kamoru.flayground.flay.domain.info.Info;

public abstract class JsonInfoSource<T extends Info<K>, K> implements InfoSource<T, K> {

	List<T> list;

	abstract File getInfoFile();
	
	abstract TypeReference<List<T>> getTypeReference();
	
	abstract T newInstance(K key);
	
	@PostConstruct
	void load() {
		File infoFile = getInfoFile();
		ObjectMapper mapper = new ObjectMapper();
		try {
			list = mapper.readValue(infoFile, getTypeReference());
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}	
	}
	
	@Override
	public List<T> getList() {
		return list;
	}

	@Override
	public T get(K key) {
		for (T t : list) {
			if (t.getKey().equals(key)) {
				return t;
			}
		}
		throw new InfoNotfoundException(key);
	}

	@Override
	public T getOrNew(K key) {
		try {
			return get(key);
		} catch(InfoNotfoundException e) {
			return newInstance(key);
		}
	}

	@Override
	public void create(T createT) {
		try {
			get(createT.getKey());
			throw new IllegalStateException("duplicated key " + createT.getKey());
		} catch(InfoNotfoundException e) {
			list.add(createT);
			save();
		}
	}

	@Override
	public void update(T updateT) {
		T t = get(updateT.getKey());
		list.remove(t);
		list.add(t);
		save();
	}

	@Override
	public void delete(T deleteT) {
		T t = get(deleteT.getKey());
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

}
