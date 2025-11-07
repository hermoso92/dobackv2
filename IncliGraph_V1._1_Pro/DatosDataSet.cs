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
[XmlRoot("DatosDataSet")]
[HelpKeyword("vs.data.DataSet")]
public class DatosDataSet : DataSet
{
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void FechasRowChangeEventHandler(object sender, FechasRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void DescargasRowChangeEventHandler(object sender, DescargasRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void datosappRowChangeEventHandler(object sender, datosappRowChangeEvent e);

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class FechasDataTable : TypedTableBase<FechasRow>
	{
		private DataColumn columnId;

		private DataColumn columnFecha;

		private DataColumn columnHora;

		private DataColumn columnId_RG;

		private DataColumn columnId_Disp;

		private DataColumn columnDatos_1;

		private DataColumn columnDatos_2;

		private DataColumn columnRegistro;

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
		public DataColumn FechaColumn => columnFecha;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn HoraColumn => columnHora;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_RGColumn => columnId_RG;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_DispColumn => columnId_Disp;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Datos_1Column => columnDatos_1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Datos_2Column => columnDatos_2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn RegistroColumn => columnRegistro;

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
		public FechasRow this[int index] => (FechasRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FechasRowChangeEventHandler FechasRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FechasRowChangeEventHandler FechasRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FechasRowChangeEventHandler FechasRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FechasRowChangeEventHandler FechasRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasDataTable()
		{
			base.TableName = "Fechas";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal FechasDataTable(DataTable table)
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
		protected FechasDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddFechasRow(FechasRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasRow AddFechasRow(string Id, string Fecha, string Hora, string Id_RG, string Id_Disp, string Datos_1, string Datos_2, string Registro, string D1, string ALFA1, string COEF1, string D2, string ALFA2, string COEF2)
		{
			FechasRow fechasRow = (FechasRow)NewRow();
			object[] itemArray = new object[14]
			{
				Id, Fecha, Hora, Id_RG, Id_Disp, Datos_1, Datos_2, Registro, D1, ALFA1,
				COEF1, D2, ALFA2, COEF2
			};
			fechasRow.ItemArray = itemArray;
			base.Rows.Add(fechasRow);
			return fechasRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasRow FindById(string Id)
		{
			return (FechasRow)base.Rows.Find(new object[1] { Id });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			FechasDataTable obj = (FechasDataTable)base.Clone();
			obj.InitVars();
			return obj;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new FechasDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnId = base.Columns["Id"];
			columnFecha = base.Columns["Fecha"];
			columnHora = base.Columns["Hora"];
			columnId_RG = base.Columns["Id_RG"];
			columnId_Disp = base.Columns["Id_Disp"];
			columnDatos_1 = base.Columns["Datos_1"];
			columnDatos_2 = base.Columns["Datos_2"];
			columnRegistro = base.Columns["Registro"];
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
			columnFecha = new DataColumn("Fecha", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFecha);
			columnHora = new DataColumn("Hora", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnHora);
			columnId_RG = new DataColumn("Id_RG", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_RG);
			columnId_Disp = new DataColumn("Id_Disp", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_Disp);
			columnDatos_1 = new DataColumn("Datos_1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDatos_1);
			columnDatos_2 = new DataColumn("Datos_2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDatos_2);
			columnRegistro = new DataColumn("Registro", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnRegistro);
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
			columnFecha.MaxLength = 100;
			columnHora.MaxLength = 100;
			columnId_RG.MaxLength = 100;
			columnId_Disp.MaxLength = 100;
			columnDatos_1.MaxLength = 100;
			columnDatos_2.MaxLength = 100;
			columnRegistro.MaxLength = 100;
			columnD1.MaxLength = 100;
			columnALFA1.MaxLength = 100;
			columnCOEF1.MaxLength = 100;
			columnD2.MaxLength = 100;
			columnALFA2.MaxLength = 100;
			columnCOEF2.MaxLength = 100;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasRow NewFechasRow()
		{
			return (FechasRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new FechasRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(FechasRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (FechasRowChanged != null)
			{
				FechasRowChanged?.Invoke(this, new FechasRowChangeEvent((FechasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (FechasRowChanging != null)
			{
				FechasRowChanging?.Invoke(this, new FechasRowChangeEvent((FechasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (FechasRowDeleted != null)
			{
				FechasRowDeleted?.Invoke(this, new FechasRowChangeEvent((FechasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (FechasRowDeleting != null)
			{
				FechasRowDeleting?.Invoke(this, new FechasRowChangeEvent((FechasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveFechasRow(FechasRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			DatosDataSet datosDataSet = new DatosDataSet();
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
			xmlSchemaAttribute.FixedValue = datosDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "FechasDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = datosDataSet.GetSchemaSerializable();
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

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class DescargasDataTable : TypedTableBase<DescargasRow>
	{
		private DataColumn columnId_descarga;

		private DataColumn columnId_RG;

		private DataColumn columnId_disp;

		private DataColumn columnRuta_folder;

		private DataColumn columnConfig1;

		private DataColumn columnConfig2;

		private DataColumn columnFecha;

		private DataColumn columnHora;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_descargaColumn => columnId_descarga;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_RGColumn => columnId_RG;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Id_dispColumn => columnId_disp;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Ruta_folderColumn => columnRuta_folder;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Config1Column => columnConfig1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Config2Column => columnConfig2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FechaColumn => columnFecha;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn HoraColumn => columnHora;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRow this[int index] => (DescargasRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DescargasRowChangeEventHandler DescargasRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DescargasRowChangeEventHandler DescargasRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DescargasRowChangeEventHandler DescargasRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DescargasRowChangeEventHandler DescargasRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasDataTable()
		{
			base.TableName = "Descargas";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal DescargasDataTable(DataTable table)
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
		protected DescargasDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddDescargasRow(DescargasRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRow AddDescargasRow(string Id_descarga, string Id_RG, string Id_disp, string Ruta_folder, string Config1, string Config2, string Fecha, string Hora)
		{
			DescargasRow descargasRow = (DescargasRow)NewRow();
			object[] itemArray = new object[8] { Id_descarga, Id_RG, Id_disp, Ruta_folder, Config1, Config2, Fecha, Hora };
			descargasRow.ItemArray = itemArray;
			base.Rows.Add(descargasRow);
			return descargasRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRow FindById_descarga(string Id_descarga)
		{
			return (DescargasRow)base.Rows.Find(new object[1] { Id_descarga });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			DescargasDataTable obj = (DescargasDataTable)base.Clone();
			obj.InitVars();
			return obj;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new DescargasDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnId_descarga = base.Columns["Id_descarga"];
			columnId_RG = base.Columns["Id_RG"];
			columnId_disp = base.Columns["Id_disp"];
			columnRuta_folder = base.Columns["Ruta_folder"];
			columnConfig1 = base.Columns["Config1"];
			columnConfig2 = base.Columns["Config2"];
			columnFecha = base.Columns["Fecha"];
			columnHora = base.Columns["Hora"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnId_descarga = new DataColumn("Id_descarga", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_descarga);
			columnId_RG = new DataColumn("Id_RG", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_RG);
			columnId_disp = new DataColumn("Id_disp", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnId_disp);
			columnRuta_folder = new DataColumn("Ruta_folder", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnRuta_folder);
			columnConfig1 = new DataColumn("Config1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnConfig1);
			columnConfig2 = new DataColumn("Config2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnConfig2);
			columnFecha = new DataColumn("Fecha", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFecha);
			columnHora = new DataColumn("Hora", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnHora);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnId_descarga }, isPrimaryKey: true));
			columnId_descarga.AllowDBNull = false;
			columnId_descarga.Unique = true;
			columnId_descarga.MaxLength = 100;
			columnId_RG.MaxLength = 100;
			columnId_disp.MaxLength = 100;
			columnRuta_folder.MaxLength = 500;
			columnConfig1.MaxLength = 100;
			columnConfig2.MaxLength = 100;
			columnFecha.MaxLength = 100;
			columnHora.MaxLength = 100;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRow NewDescargasRow()
		{
			return (DescargasRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new DescargasRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(DescargasRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (DescargasRowChanged != null)
			{
				DescargasRowChanged?.Invoke(this, new DescargasRowChangeEvent((DescargasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (DescargasRowChanging != null)
			{
				DescargasRowChanging?.Invoke(this, new DescargasRowChangeEvent((DescargasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (DescargasRowDeleted != null)
			{
				DescargasRowDeleted?.Invoke(this, new DescargasRowChangeEvent((DescargasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (DescargasRowDeleting != null)
			{
				DescargasRowDeleting?.Invoke(this, new DescargasRowChangeEvent((DescargasRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveDescargasRow(DescargasRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			DatosDataSet datosDataSet = new DatosDataSet();
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
			xmlSchemaAttribute.FixedValue = datosDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "DescargasDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = datosDataSet.GetSchemaSerializable();
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

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class datosappDataTable : TypedTableBase<datosappRow>
	{
		private DataColumn columnid_dato;

		private DataColumn columnruta;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn id_datoColumn => columnid_dato;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn rutaColumn => columnruta;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRow this[int index] => (datosappRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event datosappRowChangeEventHandler datosappRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event datosappRowChangeEventHandler datosappRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event datosappRowChangeEventHandler datosappRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event datosappRowChangeEventHandler datosappRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappDataTable()
		{
			base.TableName = "datosapp";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal datosappDataTable(DataTable table)
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
		protected datosappDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AdddatosappRow(datosappRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRow AdddatosappRow(string id_dato, string ruta)
		{
			datosappRow datosappRow = (datosappRow)NewRow();
			object[] itemArray = new object[2] { id_dato, ruta };
			datosappRow.ItemArray = itemArray;
			base.Rows.Add(datosappRow);
			return datosappRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRow FindByid_dato(string id_dato)
		{
			return (datosappRow)base.Rows.Find(new object[1] { id_dato });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			datosappDataTable obj = (datosappDataTable)base.Clone();
			obj.InitVars();
			return obj;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new datosappDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnid_dato = base.Columns["id_dato"];
			columnruta = base.Columns["ruta"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnid_dato = new DataColumn("id_dato", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnid_dato);
			columnruta = new DataColumn("ruta", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnruta);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnid_dato }, isPrimaryKey: true));
			columnid_dato.AllowDBNull = false;
			columnid_dato.Unique = true;
			columnid_dato.DefaultValue = "1";
			columnid_dato.MaxLength = 100;
			columnruta.DefaultValue = "C:\\RGIS-1";
			columnruta.MaxLength = 100;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRow NewdatosappRow()
		{
			return (datosappRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new datosappRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(datosappRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (datosappRowChanged != null)
			{
				datosappRowChanged?.Invoke(this, new datosappRowChangeEvent((datosappRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (datosappRowChanging != null)
			{
				datosappRowChanging?.Invoke(this, new datosappRowChangeEvent((datosappRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (datosappRowDeleted != null)
			{
				datosappRowDeleted?.Invoke(this, new datosappRowChangeEvent((datosappRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (datosappRowDeleting != null)
			{
				datosappRowDeleting?.Invoke(this, new datosappRowChangeEvent((datosappRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovedatosappRow(datosappRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			DatosDataSet datosDataSet = new DatosDataSet();
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
			xmlSchemaAttribute.FixedValue = datosDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "datosappDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = datosDataSet.GetSchemaSerializable();
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

	public class FechasRow : DataRow
	{
		private FechasDataTable tableFechas;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id
		{
			get
			{
				return Conversions.ToString(base[tableFechas.IdColumn]);
			}
			set
			{
				base[tableFechas.IdColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Fecha
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.FechaColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Fecha' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.FechaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Hora
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.HoraColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Hora' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.HoraColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_RG
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.Id_RGColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Id_RG' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.Id_RGColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_Disp
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.Id_DispColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Id_Disp' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.Id_DispColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Datos_1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.Datos_1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Datos_1' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.Datos_1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Datos_2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.Datos_2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Datos_2' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.Datos_2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Registro
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableFechas.RegistroColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Registro' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.RegistroColumn] = value;
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
					return Conversions.ToString(base[tableFechas.D1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'D1' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.D1Column] = value;
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
					return Conversions.ToString(base[tableFechas.ALFA1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'ALFA1' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.ALFA1Column] = value;
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
					return Conversions.ToString(base[tableFechas.COEF1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'COEF1' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.COEF1Column] = value;
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
					return Conversions.ToString(base[tableFechas.D2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'D2' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.D2Column] = value;
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
					return Conversions.ToString(base[tableFechas.ALFA2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'ALFA2' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.ALFA2Column] = value;
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
					return Conversions.ToString(base[tableFechas.COEF2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'COEF2' in table 'Fechas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableFechas.COEF2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal FechasRow(DataRowBuilder rb)
			: base(rb)
		{
			tableFechas = (FechasDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFechaNull()
		{
			return IsNull(tableFechas.FechaColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFechaNull()
		{
			base[tableFechas.FechaColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsHoraNull()
		{
			return IsNull(tableFechas.HoraColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetHoraNull()
		{
			base[tableFechas.HoraColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsId_RGNull()
		{
			return IsNull(tableFechas.Id_RGColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetId_RGNull()
		{
			base[tableFechas.Id_RGColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsId_DispNull()
		{
			return IsNull(tableFechas.Id_DispColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetId_DispNull()
		{
			base[tableFechas.Id_DispColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDatos_1Null()
		{
			return IsNull(tableFechas.Datos_1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDatos_1Null()
		{
			base[tableFechas.Datos_1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDatos_2Null()
		{
			return IsNull(tableFechas.Datos_2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDatos_2Null()
		{
			base[tableFechas.Datos_2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsRegistroNull()
		{
			return IsNull(tableFechas.RegistroColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetRegistroNull()
		{
			base[tableFechas.RegistroColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsD1Null()
		{
			return IsNull(tableFechas.D1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetD1Null()
		{
			base[tableFechas.D1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsALFA1Null()
		{
			return IsNull(tableFechas.ALFA1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetALFA1Null()
		{
			base[tableFechas.ALFA1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCOEF1Null()
		{
			return IsNull(tableFechas.COEF1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCOEF1Null()
		{
			base[tableFechas.COEF1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsD2Null()
		{
			return IsNull(tableFechas.D2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetD2Null()
		{
			base[tableFechas.D2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsALFA2Null()
		{
			return IsNull(tableFechas.ALFA2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetALFA2Null()
		{
			base[tableFechas.ALFA2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCOEF2Null()
		{
			return IsNull(tableFechas.COEF2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCOEF2Null()
		{
			base[tableFechas.COEF2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}
	}

	public class DescargasRow : DataRow
	{
		private DescargasDataTable tableDescargas;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_descarga
		{
			get
			{
				return Conversions.ToString(base[tableDescargas.Id_descargaColumn]);
			}
			set
			{
				base[tableDescargas.Id_descargaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_RG
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.Id_RGColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Id_RG' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.Id_RGColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Id_disp
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.Id_dispColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Id_disp' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.Id_dispColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Ruta_folder
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.Ruta_folderColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Ruta_folder' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.Ruta_folderColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Config1
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.Config1Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Config1' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.Config1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Config2
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.Config2Column]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Config2' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.Config2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Fecha
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.FechaColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Fecha' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.FechaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Hora
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tableDescargas.HoraColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'Hora' in table 'Descargas' is DBNull.", innerException);
				}
			}
			set
			{
				base[tableDescargas.HoraColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal DescargasRow(DataRowBuilder rb)
			: base(rb)
		{
			tableDescargas = (DescargasDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsId_RGNull()
		{
			return IsNull(tableDescargas.Id_RGColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetId_RGNull()
		{
			base[tableDescargas.Id_RGColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsId_dispNull()
		{
			return IsNull(tableDescargas.Id_dispColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetId_dispNull()
		{
			base[tableDescargas.Id_dispColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsRuta_folderNull()
		{
			return IsNull(tableDescargas.Ruta_folderColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetRuta_folderNull()
		{
			base[tableDescargas.Ruta_folderColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsConfig1Null()
		{
			return IsNull(tableDescargas.Config1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetConfig1Null()
		{
			base[tableDescargas.Config1Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsConfig2Null()
		{
			return IsNull(tableDescargas.Config2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetConfig2Null()
		{
			base[tableDescargas.Config2Column] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFechaNull()
		{
			return IsNull(tableDescargas.FechaColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFechaNull()
		{
			base[tableDescargas.FechaColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsHoraNull()
		{
			return IsNull(tableDescargas.HoraColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetHoraNull()
		{
			base[tableDescargas.HoraColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}
	}

	public class datosappRow : DataRow
	{
		private datosappDataTable tabledatosapp;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string id_dato
		{
			get
			{
				return Conversions.ToString(base[tabledatosapp.id_datoColumn]);
			}
			set
			{
				base[tabledatosapp.id_datoColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string ruta
		{
			get
			{
				try
				{
					return Conversions.ToString(base[tabledatosapp.rutaColumn]);
				}
				catch (InvalidCastException ex)
				{
					ProjectData.SetProjectError(ex);
					InvalidCastException innerException = ex;
					throw new StrongTypingException("The value for column 'ruta' in table 'datosapp' is DBNull.", innerException);
				}
			}
			set
			{
				base[tabledatosapp.rutaColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal datosappRow(DataRowBuilder rb)
			: base(rb)
		{
			tabledatosapp = (datosappDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsrutaNull()
		{
			return IsNull(tabledatosapp.rutaColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetrutaNull()
		{
			base[tabledatosapp.rutaColumn] = RuntimeHelpers.GetObjectValue(Convert.DBNull);
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class FechasRowChangeEvent : EventArgs
	{
		private FechasRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FechasRowChangeEvent(FechasRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class DescargasRowChangeEvent : EventArgs
	{
		private DescargasRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DescargasRowChangeEvent(DescargasRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class datosappRowChangeEvent : EventArgs
	{
		private datosappRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public datosappRowChangeEvent(datosappRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	private FechasDataTable tableFechas;

	private DescargasDataTable tableDescargas;

	private datosappDataTable tabledatosapp;

	private SchemaSerializationMode _schemaSerializationMode;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public FechasDataTable Fechas => tableFechas;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public DescargasDataTable Descargas => tableDescargas;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public datosappDataTable datosapp => tabledatosapp;

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
	public DatosDataSet()
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
	protected DatosDataSet(SerializationInfo info, StreamingContext context)
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
			if (dataSet.Tables["Fechas"] != null)
			{
				base.Tables.Add(new FechasDataTable(dataSet.Tables["Fechas"]));
			}
			if (dataSet.Tables["Descargas"] != null)
			{
				base.Tables.Add(new DescargasDataTable(dataSet.Tables["Descargas"]));
			}
			if (dataSet.Tables["datosapp"] != null)
			{
				base.Tables.Add(new datosappDataTable(dataSet.Tables["datosapp"]));
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
		DatosDataSet obj = (DatosDataSet)base.Clone();
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
			if (dataSet.Tables["Fechas"] != null)
			{
				base.Tables.Add(new FechasDataTable(dataSet.Tables["Fechas"]));
			}
			if (dataSet.Tables["Descargas"] != null)
			{
				base.Tables.Add(new DescargasDataTable(dataSet.Tables["Descargas"]));
			}
			if (dataSet.Tables["datosapp"] != null)
			{
				base.Tables.Add(new datosappDataTable(dataSet.Tables["datosapp"]));
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
		tableFechas = (FechasDataTable)base.Tables["Fechas"];
		if (initTable && tableFechas != null)
		{
			tableFechas.InitVars();
		}
		tableDescargas = (DescargasDataTable)base.Tables["Descargas"];
		if (initTable && tableDescargas != null)
		{
			tableDescargas.InitVars();
		}
		tabledatosapp = (datosappDataTable)base.Tables["datosapp"];
		if (initTable && tabledatosapp != null)
		{
			tabledatosapp.InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitClass()
	{
		base.DataSetName = "DatosDataSet";
		base.Prefix = "";
		base.Namespace = "http://tempuri.org/DatosDataSet.xsd";
		base.EnforceConstraints = true;
		SchemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		tableFechas = new FechasDataTable();
		base.Tables.Add(tableFechas);
		tableDescargas = new DescargasDataTable();
		base.Tables.Add(tableDescargas);
		tabledatosapp = new datosappDataTable();
		base.Tables.Add(tabledatosapp);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeFechas()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeDescargas()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializedatosapp()
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
		DatosDataSet datosDataSet = new DatosDataSet();
		XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
		XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
		XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
		xmlSchemaAny.Namespace = datosDataSet.Namespace;
		xmlSchemaSequence.Items.Add(xmlSchemaAny);
		xmlSchemaComplexType.Particle = xmlSchemaSequence;
		XmlSchema schemaSerializable = datosDataSet.GetSchemaSerializable();
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
