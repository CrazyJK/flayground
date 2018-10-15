package jk.kamoru.flayground.web.access.domain;

import java.io.Serializable;

import javax.persistence.Entity;
import javax.persistence.Id;

import jk.kamoru.flayground.Flayground;
import lombok.Data;

@Entity
@Data
public class AccessLogStatistic implements Serializable {

	private static final long serialVersionUID = Flayground.SERIAL_VERSION_UID;
	
	@Id
    public String handlerInfo;
    public long callCount;

    public AccessLogStatistic() {}
    
	public AccessLogStatistic(String handlerInfo) {
		this.handlerInfo = handlerInfo;
	}

	public void increaseCallCount() {
		++callCount;
	}

}