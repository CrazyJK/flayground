package jk.kamoru.flayground.info.source;

import java.io.File;
import java.io.IOException;
import java.util.List;

import javax.annotation.PostConstruct;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jk.kamoru.flayground.info.InfoNotfoundException;
import jk.kamoru.flayground.info.domain.Info;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class InfoSourceJsonAdapter<T extends Info<K>, K> implements InfoSource<T, K> {

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
			log.info("[{}] {} loaded", getInfoFile().getName(), list.size());
		} catch (IOException e) {
			throw new IllegalStateException("Fail to load info file " + infoFile, e);
		}	
	}
	
	@Override
	public List<T> list() {
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
			T newInstance = newInstance(key);
			list.add(newInstance);
			save();
			return newInstance;
		}
	}

	@Override
	public T create(T create) {
		try {
			get(create.getKey());
			throw new IllegalStateException("duplicated key " + create.getKey());
		} catch(InfoNotfoundException e) {
			list.add(create);
			save();
			return create;
		}
	}

	@Override
	public void update(T update) {
		T t = get(update.getKey());
		list.remove(t);
		list.add(update);
		save();
	}

	@Override
	public void delete(T delete) {
		T t = get(delete.getKey());
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
