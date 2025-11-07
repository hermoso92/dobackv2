using System;
using System.CodeDom.Compiler;
using System.Collections;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Runtime.CompilerServices;
using System.Runtime.Serialization;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[Serializable]
[DesignerCategory("code")]
[ToolboxItem(true)]
[XmlSchemaProvider("GetTypedDataSetSchema")]
[XmlRoot("VehiculosDataSet")]
[HelpKeyword("vs.data.DataSet")]
public class VehiculosDataSet : DataSet
{
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void RGRowChangeEventHandler(object sender, RGRowChangeEvent e);

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class RGDataTable : TypedTableBase<RGRow>
	{
		private DataColumn columnId;

		private DataColumn columnId_Dispositivo;

		private DataColumn columnNum_Identificacion;

		private DataColumn columnMatricula;

		private DataColumn columnConfig_1;

		private DataColumn columnConfig_2;

		private DataColumn columnFecha_Carga;

		private DataColumn columnDatos_Cargados;

		private DataColumn columnObservaciones;

		private DataColumn columnIdentificador;

		private DataColumn columnT11;

		private DataColumn columnT21;

		private DataColumn columnT31;

		private DataColumn columnT41;

		private DataColumn columnT12;

		private DataColumn columnT22;

		private DataColumn columnT32;

		private DataColumn columnT42;

		private DataColumn columnKA1;

		private DataColumn columnKG1;

		private DataColumn columnKA2;

		private DataColumn columnKG2;

		private DataColumn columnD1;

		private DataColumn columnALFA1;

		private DataColumn columnCOEF1;

		private DataColumn columnD2;

		private DataColumn columnALFA2;

		private DataColumn columnCOEF2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn IdColumn => columnId;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_DispositivoColumn => columnId_Dispositivo;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Num_IdentificacionColumn => columnNum_Identificacion;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn MatriculaColumn => columnMatricula;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Config_1Column => columnConfig_1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Config_2Column => columnConfig_2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Fecha_CargaColumn => columnFecha_Carga;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Datos_CargadosColumn => columnDatos_Cargados;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ObservacionesColumn => columnObservaciones;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn IdentificadorColumn => columnIdentificador;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T11Column => columnT11;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T21Column => columnT21;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T31Column => columnT31;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T41Column => columnT41;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T12Column => columnT12;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T22Column => columnT22;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T32Column => columnT32;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn T42Column => columnT42;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KA1Column => columnKA1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KG1Column => columnKG1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KA2Column => columnKA2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KG2Column => columnKG2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn D1Column => columnD1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ALFA1Column => columnALFA1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn COEF1Column => columnCOEF1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn D2Column => columnD2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ALFA2Column => columnALFA2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn COEF2Column => columnCOEF2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRow this[int index] => (RGRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event RGRowChangeEventHandler RGRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event RGRowChangeEventHandler RGRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event RGRowChangeEventHandler RGRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event RGRowChangeEventHandler RGRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGDataTable()
		{
			base.TableName = "RG";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal RGDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (Operators.CompareString(table.Locale.ToString(), table.DataSet.Locale.ToString(), TextCompare: false) != 0)
			{
				base.Locale = table.Locale;
			}
			if (Operators.CompareString(table.Namespace, table.DataSet.Namespace, TextCompare: false) != 0)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected RGDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddRGRow(RGRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRow AddRGRow(string Id, string Id_Dispositivo, string Num_Identificacion, string Matricula, string Config_1, string Config_2, string Fecha_Carga, string Datos_Cargados, string Observaciones, string Identificador, string T11, string T21, string T31, string T41, string T12, string T22, string T32, string T42, string KA1, string KG1, string KA2, string KG2, string D1, string ALFA1, string COEF1, string D2, string ALFA2, string COEF2)
		{
			RGRow rGRow = (RGRow)NewRow();
			object[] itemArray = new object[28]
			{
				Id, Id_Dispositivo, Num_Identificacion, Matricula, Config_1, Config_2, Fecha_Carga, Datos_Cargados, Observaciones, Identificador,
				T11, T21, T31, T41, T12, T22, T32, T42, KA1, KG1,
				KA2, KG2, D1, ALFA1, COEF1, D2, ALFA2, COEF2
			};
			rGRow.ItemArray = itemArray;
			base.Rows.Add(rGRow);
			return rGRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRow FindById(string Id)
		{
			return (RGRow)base.Rows.Find(new object[1] { Id });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			RGDataTable obj = (RGDataTable)base.Clone();
			obj.InitVars();
			return obj;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new RGDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnId = base.Columns["Id"];
			columnId_Dispositivo = base.Columns["Id_Dispositivo"];
			columnNum_Identificacion = base.Columns["Num_Identificacion"];
			columnMatricula = base.Columns["Matricula"];
			columnConfig_1 = base.Columns["Config_1"];
			columnConfig_2 = base.Columns["Config_2"];
			columnFecha_Carga = base.Columns["Fecha_Carga"];
			columnDatos_Cargados = base.Columns["Datos_Cargados"];
			columnObservaciones = base.Columns["Observaciones"];
			columnIdentificador = base.Columns["Identificador"];
			columnT11 = base.Columns["T11"];
			columnT21 = base.Columns["T21"];
			columnT31 = base.Columns["T31"];
			columnT41 = base.Columns["T41"];
			columnT12 = base.Columns["T12"];
			columnT22 = base.Columns["T22"];
			columnT32 = base.Columns["T32"];
			columnT42 = base.Columns["T42"];
			columnKA1 = base.Columns["KA1"];
			columnKG1 = base.Columns["KG1"];
			columnKA2 = base.Columns["KA2"];
			columnKG2 = base.Columns["KG2"];
			columnD1 = base.Columns["D1"];
			columnALFA1 = base.Columns["ALFA1"];
			columnCOEF1 = base.Columns["COEF1"];
			columnD2 = base.Columns["D2"];
			columnALFA2 = base.Columns["ALFA2"];
			columnCOEF2 = base.Columns["COEF2"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnId = new DataColumn("Id", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId);
			columnId_Dispositivo = new DataColumn("Id_Dispositivo", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_Dispositivo);
			columnNum_Identificacion = new DataColumn("Num_Identificacion", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnNum_Identificacion);
			columnMatricula = new DataColumn("Matricula", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMatricula);
			columnConfig_1 = new DataColumn("Config_1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnConfig_1);
			columnConfig_2 = new DataColumn("Config_2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnConfig_2);
			columnFecha_Carga = new DataColumn("Fecha_Carga", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFecha_Carga);
			columnDatos_Cargados = new DataColumn("Datos_Cargados", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDatos_Cargados);
			columnObservaciones = new DataColumn("Observaciones", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnObservaciones);
			columnIdentificador = new DataColumn("Identificador", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnIdentificador);
			columnT11 = new DataColumn("T11", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT11);
			columnT21 = new DataColumn("T21", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT21);
			columnT31 = new DataColumn("T31", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT31);
			columnT41 = new DataColumn("T41", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT41);
			columnT12 = new DataColumn("T12", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT12);
			columnT22 = new DataColumn("T22", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT22);
			columnT32 = new DataColumn("T32", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT32);
			columnT42 = new DataColumn("T42", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnT42);
			columnKA1 = new DataColumn("KA1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnKA1);
			columnKG1 = new DataColumn("KG1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnKG1);
			columnKA2 = new DataColumn("KA2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnKA2);
			columnKG2 = new DataColumn("KG2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnKG2);
			columnD1 = new DataColumn("D1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnD1);
			columnALFA1 = new DataColumn("ALFA1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnALFA1);
			columnCOEF1 = new DataColumn("COEF1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCOEF1);
			columnD2 = new DataColumn("D2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnD2);
			columnALFA2 = new DataColumn("ALFA2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnALFA2);
			columnCOEF2 = new DataColumn("COEF2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCOEF2);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnId }, isPrimaryKey: true));
			columnId.AllowDBNull = false;
			columnId.Unique = true;
			columnId.MaxLength = 100;
			columnId_Dispositivo.MaxLength = 100;
			columnNum_Identificacion.MaxLength = 100;
			columnMatricula.MaxLength = 100;
			columnConfig_1.MaxLength = 100;
			columnConfig_2.MaxLength = 100;
			columnFecha_Carga.MaxLength = 100;
			columnDatos_Cargados.MaxLength = 100;
			columnObservaciones.MaxLength = 536870911;
			columnIdentificador.MaxLength = 100;
			columnT11.MaxLength = 100;
			columnT21.MaxLength = 100;
			columnT31.MaxLength = 100;
			columnT41.MaxLength = 100;
			columnT12.MaxLength = 100;
			columnT22.MaxLength = 100;
			columnT32.MaxLength = 100;
			columnT42.MaxLength = 100;
			columnKA1.MaxLength = 100;
			columnKG1.MaxLength = 100;
			columnKA2.MaxLength = 100;
			columnKG2.MaxLength = 100;
			columnD1.MaxLength = 100;
			columnALFA1.MaxLength = 100;
			columnCOEF1.MaxLength = 100;
			columnD2.MaxLength = 100;
			columnALFA2.MaxLength = 100;
			columnCOEF2.MaxLength = 100;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRow NewRGRow()
		{
			return (RGRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new RGRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(RGRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (RGRowChanged != null)
			{
				RGRowChanged?.Invoke(this, new RGRowChangeEvent((RGRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (RGRowChanging != null)
			{
				RGRowChanging?.Invoke(this, new RGRowChangeEvent((RGRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (RGRowDeleted != null)
			{
				RGRowDeleted?.Invoke(this, new RGRowChangeEvent((RGRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (RGRowDeleting != null)
			{
				RGRowDeleting?.Invoke(this, new RGRowChangeEvent((RGRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveRGRow(RGRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			VehiculosDataSet vehiculosDataSet = new VehiculosDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = vehiculosDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "RGDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = vehiculosDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						XmlSchema obj = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						obj.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	public class RGRow : DataRow
	{
		private RGDataTable tableRG;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id
		{
			get
			{
				return Conversions.ToString(base[tableRG.IdColumn]);
			}
			set
			{
				base[tableRG.IdColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_Dispositivo
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Id_DispositivoColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Id_Dispositivo' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Id_DispositivoColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Num_Identificacion
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Num_IdentificacionColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Num_Identificacion' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Num_IdentificacionColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Matricula
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.MatriculaColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Matricula' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.MatriculaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Config_1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Config_1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Config_1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Config_1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Config_2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Config_2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Config_2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Config_2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Fecha_Carga
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Fecha_CargaColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Fecha_Carga' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Fecha_CargaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Datos_Cargados
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.Datos_CargadosColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Datos_Cargados' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.Datos_CargadosColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Observaciones
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.ObservacionesColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Observaciones' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.ObservacionesColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Identificador
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.IdentificadorColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Identificador' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.IdentificadorColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T11
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T11Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T11' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T11Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T21
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T21Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T21' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T21Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T31
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T31Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T31' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T31Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T41
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T41Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T41' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T41Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T12
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T12Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T12' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T12Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T22
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T22Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T22' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T22Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T32
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T32Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T32' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T32Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string T42
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.T42Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'T42' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.T42Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string KA1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.KA1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'KA1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.KA1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string KG1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.KG1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'KG1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.KG1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string KA2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.KA2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'KA2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.KA2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string KG2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.KG2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'KG2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.KG2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string D1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.D1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'D1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.D1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string ALFA1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.ALFA1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'ALFA1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.ALFA1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string COEF1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.COEF1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'COEF1' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.COEF1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string D2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.D2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'D2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.D2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string ALFA2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.ALFA2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'ALFA2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.ALFA2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string COEF2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableRG.COEF2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'COEF2' in table 'RG' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableRG.COEF2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal RGRow(DataRowBuilder rb)
			: base(rb)
		{
			tableRG = (RGDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsId_DispositivoNull()
		{
			return IsNull(tableRG.Id_DispositivoColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetId_DispositivoNull()
		{
			base[tableRG.Id_DispositivoColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNum_IdentificacionNull()
		{
			return IsNull(tableRG.Num_IdentificacionColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetNum_IdentificacionNull()
		{
			base[tableRG.Num_IdentificacionColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsMatriculaNull()
		{
			return IsNull(tableRG.MatriculaColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetMatriculaNull()
		{
			base[tableRG.MatriculaColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsConfig_1Null()
		{
			return IsNull(tableRG.Config_1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetConfig_1Null()
		{
			base[tableRG.Config_1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsConfig_2Null()
		{
			return IsNull(tableRG.Config_2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetConfig_2Null()
		{
			base[tableRG.Config_2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFecha_CargaNull()
		{
			return IsNull(tableRG.Fecha_CargaColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFecha_CargaNull()
		{
			base[tableRG.Fecha_CargaColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDatos_CargadosNull()
		{
			return IsNull(tableRG.Datos_CargadosColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDatos_CargadosNull()
		{
			base[tableRG.Datos_CargadosColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsObservacionesNull()
		{
			return IsNull(tableRG.ObservacionesColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetObservacionesNull()
		{
			base[tableRG.ObservacionesColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsIdentificadorNull()
		{
			return IsNull(tableRG.IdentificadorColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetIdentificadorNull()
		{
			base[tableRG.IdentificadorColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT11Null()
		{
			return IsNull(tableRG.T11Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT11Null()
		{
			base[tableRG.T11Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT21Null()
		{
			return IsNull(tableRG.T21Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT21Null()
		{
			base[tableRG.T21Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT31Null()
		{
			return IsNull(tableRG.T31Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT31Null()
		{
			base[tableRG.T31Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT41Null()
		{
			return IsNull(tableRG.T41Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT41Null()
		{
			base[tableRG.T41Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT12Null()
		{
			return IsNull(tableRG.T12Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT12Null()
		{
			base[tableRG.T12Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT22Null()
		{
			return IsNull(tableRG.T22Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT22Null()
		{
			base[tableRG.T22Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT32Null()
		{
			return IsNull(tableRG.T32Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT32Null()
		{
			base[tableRG.T32Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsT42Null()
		{
			return IsNull(tableRG.T42Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetT42Null()
		{
			base[tableRG.T42Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKA1Null()
		{
			return IsNull(tableRG.KA1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKA1Null()
		{
			base[tableRG.KA1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKG1Null()
		{
			return IsNull(tableRG.KG1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKG1Null()
		{
			base[tableRG.KG1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKA2Null()
		{
			return IsNull(tableRG.KA2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKA2Null()
		{
			base[tableRG.KA2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKG2Null()
		{
			return IsNull(tableRG.KG2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKG2Null()
		{
			base[tableRG.KG2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsD1Null()
		{
			return IsNull(tableRG.D1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetD1Null()
		{
			base[tableRG.D1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsALFA1Null()
		{
			return IsNull(tableRG.ALFA1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetALFA1Null()
		{
			base[tableRG.ALFA1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCOEF1Null()
		{
			return IsNull(tableRG.COEF1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCOEF1Null()
		{
			base[tableRG.COEF1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsD2Null()
		{
			return IsNull(tableRG.D2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetD2Null()
		{
			base[tableRG.D2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsALFA2Null()
		{
			return IsNull(tableRG.ALFA2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetALFA2Null()
		{
			base[tableRG.ALFA2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCOEF2Null()
		{
			return IsNull(tableRG.COEF2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCOEF2Null()
		{
			base[tableRG.COEF2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class RGRowChangeEvent : EventArgs
	{
		private RGRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public RGRowChangeEvent(RGRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	private RGDataTable tableRG;

	private SchemaSerializationMode _schemaSerializationMode;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public RGDataTable RG => tableRG;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(true)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Visible)]
	public override SchemaSerializationMode SchemaSerializationMode
	{
		get
		{
			return _schemaSerializationMode;
		}
		set
		{
			_schemaSerializationMode = value;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	public new DataTableCollection Tables => base.Tables;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	public new DataRelationCollection Relations => base.Relations;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public VehiculosDataSet()
	{
		_schemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		BeginInit();
		InitClass();
		CollectionChangeEventHandler value = SchemaChanged;
		base.Tables.CollectionChanged += value;
		base.Relations.CollectionChanged += value;
		EndInit();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected VehiculosDataSet(SerializationInfo info, StreamingContext context)
		: base(info, context, ConstructSchema: false)
	{
		_schemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		if (IsBinarySerialized(info, context))
		{
			InitVars(initTable: false);
			CollectionChangeEventHandler value = SchemaChanged;
			Tables.CollectionChanged += value;
			Relations.CollectionChanged += value;
			return;
		}
		string s = Conversions.ToString(info.GetValue("XmlSchema", typeof(string)));
		if (DetermineSchemaSerializationMode(info, context) == SchemaSerializationMode.IncludeSchema)
		{
			DataSet dataSet = new DataSet();
			dataSet.ReadXmlSchema(new XmlTextReader(new StringReader(s)));
			if (dataSet.Tables["RG"] != null)
			{
				base.Tables.Add(new RGDataTable(dataSet.Tables["RG"]));
			}
			base.DataSetName = dataSet.DataSetName;
			base.Prefix = dataSet.Prefix;
			base.Namespace = dataSet.Namespace;
			base.Locale = dataSet.Locale;
			base.CaseSensitive = dataSet.CaseSensitive;
			base.EnforceConstraints = dataSet.EnforceConstraints;
			Merge(dataSet, preserveChanges: false, MissingSchemaAction.Add);
			InitVars();
		}
		else
		{
			ReadXmlSchema(new XmlTextReader(new StringReader(s)));
		}
		GetSerializationData(info, context);
		CollectionChangeEventHandler value2 = SchemaChanged;
		base.Tables.CollectionChanged += value2;
		Relations.CollectionChanged += value2;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override void InitializeDerivedDataSet()
	{
		BeginInit();
		InitClass();
		EndInit();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public override DataSet Clone()
	{
		VehiculosDataSet obj = (VehiculosDataSet)base.Clone();
		obj.InitVars();
		obj.SchemaSerializationMode = SchemaSerializationMode;
		return obj;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override bool ShouldSerializeTables()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override bool ShouldSerializeRelations()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override void ReadXmlSerializable(XmlReader reader)
	{
		if (DetermineSchemaSerializationMode(reader) == SchemaSerializationMode.IncludeSchema)
		{
			Reset();
			DataSet dataSet = new DataSet();
			dataSet.ReadXml(reader);
			if (dataSet.Tables["RG"] != null)
			{
				base.Tables.Add(new RGDataTable(dataSet.Tables["RG"]));
			}
			base.DataSetName = dataSet.DataSetName;
			base.Prefix = dataSet.Prefix;
			base.Namespace = dataSet.Namespace;
			base.Locale = dataSet.Locale;
			base.CaseSensitive = dataSet.CaseSensitive;
			base.EnforceConstraints = dataSet.EnforceConstraints;
			Merge(dataSet, preserveChanges: false, MissingSchemaAction.Add);
			InitVars();
		}
		else
		{
			ReadXml(reader);
			InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override XmlSchema GetSchemaSerializable()
	{
		MemoryStream memoryStream = new MemoryStream();
		WriteXmlSchema(new XmlTextWriter(memoryStream, null));
		memoryStream.Position = 0L;
		return XmlSchema.Read(new XmlTextReader(memoryStream), null);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	internal void InitVars()
	{
		InitVars(initTable: true);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	internal void InitVars(bool initTable)
	{
		tableRG = (RGDataTable)base.Tables["RG"];
		if (initTable && tableRG != null)
		{
			tableRG.InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitClass()
	{
		base.DataSetName = "VehiculosDataSet";
		base.Prefix = "";
		base.Namespace = "http://tempuri.org/VehiculosDataSet.xsd";
		base.EnforceConstraints = true;
		SchemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		tableRG = new RGDataTable();
		base.Tables.Add(tableRG);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeRG()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void SchemaChanged(object sender, CollectionChangeEventArgs e)
	{
		if (e.Action == CollectionChangeAction.Remove)
		{
			InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public static XmlSchemaComplexType GetTypedDataSetSchema(XmlSchemaSet xs)
	{
		VehiculosDataSet vehiculosDataSet = new VehiculosDataSet();
		XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
		XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
		XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
		xmlSchemaAny.Namespace = vehiculosDataSet.Namespace;
		xmlSchemaSequence.Items.Add(xmlSchemaAny);
		xmlSchemaComplexType.Particle = xmlSchemaSequence;
		XmlSchema schemaSerializable = vehiculosDataSet.GetSchemaSerializable();
		if (xs.Contains(schemaSerializable.TargetNamespace))
		{
			MemoryStream memoryStream = new MemoryStream();
			MemoryStream memoryStream2 = new MemoryStream();
			try
			{
				schemaSerializable.Write(memoryStream);
				IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
				while (enumerator.MoveNext())
				{
					XmlSchema obj = (XmlSchema)enumerator.Current;
					memoryStream2.SetLength(0L);
					obj.Write(memoryStream2);
					if (memoryStream.Length == memoryStream2.Length)
					{
						memoryStream.Position = 0L;
						memoryStream2.Position = 0L;
						while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
						{
						}
						if (memoryStream.Position == memoryStream.Length)
						{
							return xmlSchemaComplexType;
						}
					}
				}
			}
			finally
			{
				memoryStream?.Close();
				memoryStream2?.Close();
			}
		}
		xs.Add(schemaSerializable);
		return xmlSchemaComplexType;
	}
}
